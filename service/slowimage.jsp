<%@ page language="java" pageEncoding="UTF-8" contentType="text/html;charset=UTF-8"%>
<%@ page import="java.io.*,java.util.*, javax.servlet.*"%>
<%@ page import="javax.servlet.http.*"%>
<%@ page import="org.apache.commons.fileupload.*"%>
<%@ page import="org.apache.commons.fileupload.disk.*"%>
<%@ page import="org.apache.commons.fileupload.servlet.*"%>
<%@ page import="org.apache.commons.io.output.*"%>
<%@ page import="org.apache.commons.codec.binary.Base64"%>
<%@ page import="org.apache.commons.io.FileUtils"%>
<%@ page import="com.jatools.mireport.*"%>
<%@ page import="javax.servlet.*,java.io.*" %>
<%
  Thread.sleep(114000);
  response.setContentType("image/png");
  File f = new File("E:\\java\\dddy.saas\\webapps\\images\\rightoff.png");
  FileInputStream fis = new FileInputStream(f);
  byte[] buffer = new byte[(int)f.length()];
  fis.read(buffer,0,(int)f.length());
  fis.close();
  ServletOutputStream os = response.getOutputStream();
  os.write(buffer);
  os.close();
%>